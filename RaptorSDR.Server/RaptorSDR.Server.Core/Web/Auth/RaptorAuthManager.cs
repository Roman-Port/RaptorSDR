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

            //Load all registered users into memory
            foreach (var s in db.users)
                LoadSession(s);

            //A guest user MUST exist. Make sure one exists, even if it has no permissions
            if (!GetAccountByUsername("guest", out RaptorAuthenticatedUserAccount guest))
            {
                CreateAccount("guest", "raptor");
            }

            //Save
            Save();
        }

        private static readonly char[] RAND_CHARSET = "0123456789QWERTYUIOPASDFGHJKLZXCVBNM".ToCharArray();

        private RNGCryptoServiceProvider crypto = new RNGCryptoServiceProvider(); 
        private string authFile;
        private IRaptorControl control;
        private RaptorAuthDatabase db;
        private Dictionary<RaptorAuthenticatedUserAccount, RaptorSession> sessions = new Dictionary<RaptorAuthenticatedUserAccount, RaptorSession>();

        public IEnumerable<RaptorAuthenticatedUserAccount> EnumerateAccounts()
        { 
            return db.users;
        }

        public bool GetAccountByUsername(string username, out RaptorAuthenticatedUserAccount account)
        {
            lock(db)
            {
                foreach (var a in db.users)
                {
                    account = a;
                    if (a.username == username)
                        return true;
                }
            }
            account = null;
            return false;
        }

        public string CreateAccount(string username, string password)
        {
            //Validate username and password
            if (username == null || username.Length == 0)
                throw new RaptorAuthException(RaptorAuthStatus.MALFORMED_USERNAME);
            if (password == null)
                throw new RaptorAuthException(RaptorAuthStatus.MALFORMED_PASSWORD);

            //Create salt
            byte[] salt = new byte[16];
            crypto.GetBytes(salt);

            //Generate password hash
            byte[] hash = HashPassword(password, salt);

            //Make account
            RaptorAuthenticatedUserAccount account = new RaptorAuthenticatedUserAccount
            {
                username = username,
                password_hash = hash,
                salt = salt,
                is_admin = false,
                scope_system = 0,
                scope_plugin = new List<string>(),
                access_token = GenerateRandomSecureString(32),
                created = DateTime.UtcNow
            };

            //Register account on disk
            lock (db.users)
            {
                //Ensure none already exist with this username
                if(GetAccountByUsername(username, out RaptorAuthenticatedUserAccount accountExisting))
                    throw new RaptorAuthException(RaptorAuthStatus.ACCOUNT_EXISTS);

                //Add and save
                db.users.Add(account);
                Save();
            }

            //Create session
            RaptorSession session = LoadSession(account);

            return account.access_token;
        }

        public string LoginAccount(string username, string password)
        {
            //Get the account
            if (!GetAccountByUsername(username, out RaptorAuthenticatedUserAccount account))
                throw new RaptorAuthException(RaptorAuthStatus.INVALID_CREDENTIALS);

            //Generate challenge hash
            byte[] challenge = HashPassword(password, account.salt);

            //Compare the saved hash to the challenge hash
            for (int i = 0; i < challenge.Length; i++)
            {
                if(account.password_hash[i] != challenge[i])
                    throw new RaptorAuthException(RaptorAuthStatus.INVALID_CREDENTIALS);
            }

            return account.access_token;
        }

        public string InvalidateAccountTokens(string username)
        {
            //Get the account
            if (GetAccountByUsername(username, out RaptorAuthenticatedUserAccount account))
                throw new RaptorAuthException(RaptorAuthStatus.INVALID_CREDENTIALS);

            //Reset
            account.access_token = GenerateRandomSecureString(32);
            Save();

            return account.access_token;
        }

        public void DeleteAccount(string username)
        {
            //Get the account
            if (GetAccountByUsername(username, out RaptorAuthenticatedUserAccount account))
                throw new RaptorAuthException(RaptorAuthStatus.INVALID_CREDENTIALS);

            //Reset
            lock (db)
                db.users.Remove(account);
            lock (sessions)
                sessions.Remove(account);
            Save();
        }

        public bool AuthenticateSession(string token, out IRaptorSession session)
        {
            //Search for an account with the same token
            lock (db)
            {
                foreach (var a in db.users)
                {
                    if (a.access_token == token)
                    {
                        session = sessions[a];
                        return true;
                    }
                }
            }

            session = null;
            return false;
        }

        private RaptorSession LoadSession(RaptorAuthenticatedUserAccount info)
        {
            var session = new RaptorSession(control, GenerateRandomSecureString(8), info);
            sessions.Add(info, session);
            return session;
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
