using Newtonsoft.Json;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.Auth;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace RaptorSDR.Server.Core.Web.Auth
{
    public class RaptorAuthManager : IRaptorAuthManager
    {
        public RaptorAuthManager(IRaptorControl control, string authFile)
        {
            //Configure
            this.control = control;
            this.authFile = authFile;

            //Load database
            if (File.Exists(authFile))
                db = JsonConvert.DeserializeObject<RaptorAuthDatabase>(File.ReadAllText(authFile));
            else
                db = new RaptorAuthDatabase();

            //A guest user MUST exist. Make sure one exists, even if it has no permissions
            if(!GetUserByUsername("guest", out RaptorAuthenticatedUserAccount guest))
            {
                SessionRegister("guest", "raptor", out IRaptorSession guestSession);
            }

            //Save
            Save();
        }

        private static readonly char[] RAND_CHARSET = "0123456789QWERTYUIOPASDFGHJKLZXCVBNM".ToCharArray();

        private RNGCryptoServiceProvider crypto = new RNGCryptoServiceProvider(); 

        private string authFile;
        private IRaptorControl control;
        private RaptorAuthDatabase db;
        private ConcurrentDictionary<string, IRaptorSession> sessions = new ConcurrentDictionary<string, IRaptorSession>();

        public IEnumerable<RaptorAuthenticatedUserAccount> EnumerateAccounts()
        { 
            return db.users;
        }

        public RaptorAuthStatus SessionRegister(string username, string password, out IRaptorSession session)
        {
            //Make sure the account does not already exist
            session = null;
            if (GetUserByUsername(username, out RaptorAuthenticatedUserAccount account))
                return RaptorAuthStatus.ACCOUNT_EXISTS;

            //Validate username and password
            if (username == null || username.Length == 0)
                return RaptorAuthStatus.MALFORMED_USERNAME;
            if (password == null)
                return RaptorAuthStatus.MALFORMED_PASSWORD;

            //Create salt
            byte[] salt = new byte[16];
            crypto.GetBytes(salt);

            //Generate password hash
            byte[] hash = HashPassword(password, salt);

            //Make account
            account = new RaptorAuthenticatedUserAccount
            {
                username = username,
                password_hash = hash,
                salt = salt,
                is_admin = false,
                scope_system = 0,
                scope_plugin = new List<string>(),
                refresh_token = GenerateRandomSecureString(32),
                created = DateTime.UtcNow
            };

            //Register account
            lock (db.users)
            {
                db.users.Add(account);
                Save();
            }

            //Set
            session = CreateSession(account);

            //Check if this account has any permissions
            if (!account.is_admin && account.scope_system == 0 && account.scope_plugin.Count == 0)
                return RaptorAuthStatus.NO_PERMISSIONS;

            return RaptorAuthStatus.OK;
        }

        public RaptorAuthStatus SessionLogin(string username, string password, out IRaptorSession session)
        {
            //Get the account
            session = null;
            if (!GetUserByUsername(username, out RaptorAuthenticatedUserAccount account))
                return RaptorAuthStatus.INVALID_CREDENTIALS;

            //Generate challenge hash
            byte[] challenge = HashPassword(password, account.salt);

            //Compare the saved hash to the challenge hash
            bool ok = true;
            for (int i = 0; i < challenge.Length; i++)
                ok = ok && account.password_hash[i] == challenge[i];

            //If bad, abort
            if (!ok)
                return RaptorAuthStatus.INVALID_CREDENTIALS;

            //Make new session
            session = CreateSession(account);

            //Check if this account has any permissions
            if (!account.is_admin && account.scope_system == 0 && account.scope_plugin.Count == 0)
                return RaptorAuthStatus.NO_PERMISSIONS;

            return RaptorAuthStatus.OK;
        }

        public RaptorAuthStatus SessionRefresh(string token, out IRaptorSession session)
        {
            //Find matching account
            lock (db.users)
            {
                foreach (var a in db.users)
                {
                    if (a.refresh_token == token && token != null)
                    {
                        session = CreateSession(a);
                        return RaptorAuthStatus.OK;
                    }
                }
            }

            //Failed
            session = null;
            return RaptorAuthStatus.INVALID_CREDENTIALS;
        }

        public void RemoveAccount(RaptorAuthenticatedUserAccount account)
        {
            db.users.Remove(account);
            Save();
        }

        private IRaptorSession CreateSession(RaptorUserAccount account)
        {
            //Create session
            RaptorSession session = new RaptorSession(control, GenerateRandomSecureString(16), null, account);

            //Add session
            string token;
            do
            {
                token = GenerateRandomSecureString(32);
            } while (!sessions.TryAdd(token, session));

            //Update
            session.SetToken(token);

            return session;
        }

        public bool Authenticate(string token, out IRaptorSession session)
        {
            session = null;
            return token != null && sessions.TryGetValue(token, out session);
        }

        public bool GetUserByUsername(string username, out RaptorAuthenticatedUserAccount account)
        {
            lock(db.users)
            {
                foreach(var a in db.users)
                {
                    if (a.username == username)
                    {
                        account = a;
                        return true;
                    }
                }
            }
            account = null;
            return false;
        }

        public void Save()
        {
            File.WriteAllText(authFile, JsonConvert.SerializeObject(db));
        }

        private static byte[] HashPassword(string password, byte[] salt)
        {
            //Encode input
            byte[] input = new byte[Encoding.UTF8.GetByteCount(password) + salt.Length];
            Encoding.UTF8.GetBytes(password, 0, password.Length, input, 0);
            salt.CopyTo(input, input.Length - salt.Length);

            //Hash
            byte[] output;
            using (SHA256 sha = SHA256.Create())
                output = sha.ComputeHash(input);

            return output;
        }

        private string GenerateRandomSecureString(int length)
        {
            //Randomize
            byte[] rand = new byte[length];
            crypto.GetBytes(rand);

            //Convert
            char[] output = new char[length];
            for (int i = 0; i < length; i++)
                output[i] = RAND_CHARSET[rand[i] % RAND_CHARSET.Length];

            return new string(output);
        }
    }
}
