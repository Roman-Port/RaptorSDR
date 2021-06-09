# RaptorSDR

RaptorSDR is a web-based, modular, powerful, and cross-platform SDR. The server handles everything, while you connect to it with a web browser.

## Setting Up

Right now, you'll have to build everything yourself. The build process will be simplified in the future. For now, you'll need git, [node.js](https://nodejs.org/en/), and [Dotnet Core 3.1](https://dotnet.microsoft.com/download). The following steps will guide you through setup.

First, you'll need to clone the repository to your local disk:

```
git clone --recursive https://github.com/Roman-Port/RaptorSDR
```

Then, you'll need to set a couple of enviornmental variables. You may need to restart the PowerShell window on Windows afterwards. Set these variables:

* ``RAPTORSDR_USER`` - User directory for storing various bits. Can be anywhere you'd like.
* ``RAPTORSDR_SDK`` - Path to the root of the cloned git repo.

Now, it's time to build the backend as well as the web page. The following script will build everything needed for you, assuming you're running from the root of the cloned repo (you'll have to ``cd`` into it).

* WINDOWS: ``./build_core.bat``
* LINUX: ``./build_core.sh`` (untested)

Now, *optionally*, you should add the RaptorSDR plugin utility to your PATH. It is located in ``RaptorSDR.Server\RaptorPluginUtil\bin\Release\netcoreapp3.1\``.

Now, we'll need to build each of the built-in plugins. First-time build may take some time. In **each** of the folders inside of the ``Plugins`` folder, run the following command:

``RaptorPluginUtil build``

Almost done. Head into ``RaptorSDR.Server\RaptorSDR.Server\bin\Release\netcoreapp3.1\`` and copy the ``libvolk.so`` file from the root of the repo into it. While not absolutely required, it will speed up the program immensely.

Now, start the server from that folder and go to the [user accounts](#user-accounts) section to register a user.

Once that's done, you can navigate to http://localhost:35341/ to access the server.

## User Accounts

User accounts are required to do pretty much anything in RaptorSDR. They allow people access to do certain things with the server. Commands are included to manage them.

### Creating a User

When the server is first set up, no accounts with permissions exist. You'll need to create one. With the server running, issue the following command to create a new user:

```
accounts create <username> <password>
```

The user will be created with no permissions. You'll need to continue to the next section to add them. Passwords are hashed+salted and saved on disk.

If you're in a hurry and just want full access for your own account, run ``accounts grant admin <username>``.

### Granting Permissions

Three kinds of permissions exist for user accounts:

* ``admin`` - A simple true/false value that grants a user __all__ permissions possible, including free access to the disk. This is a powerful permission.
* ``system`` - System permissions are built into the system and do not rely on any plugins. View the table below for a list of permissions.
* ``plugin`` - Plugin permissions are string values that can be used by specific plugins.

To grant a user admin access, run the following command. Keep in mind that this is a DANGEROUS permission to grant:

```
accounts grant admin <username>
```

You can also grant system access in a similar manner:

```
accounts grant system <username> <scope>
```

### System Permissions Table

| Name                 | Description                                                |
|----------------------|------------------------------------------------------------|
| CONNECT              | Connect to RPC and read settings                           |
| CONTROL_BASIC        | Control basic settings (tuning, modulation, bandwidth)     |
| CONTROL_POWER        | Turn on/off the radio                                      |
| FILE_READ_MANAGED    | READ from MANAGED files only                               |
| FILE_READ_ANYWHERE   | READ from ANYWHERE on disk                                 |
| FILE_WRITE_MANAGED   | WRITE to MANAGED files only, implies FILE_READ_MANAGED     |
| FILE_WRITE_ANYWHERE  | WRITE to ANYWHERE on disk, implies FILE_READ_ANYWHERE      |
| FILE_DELETE_MANAGED  | DELETE from MANAGED files only, implies FILE_WRITE_MANAGED |
| FILE_DELETE_ANYWHERE | DELETE from ANYWHERE on disk, implies FILE_WRITE_MANAGED   |

### Listing Users

Run ``accounts list`` to view a list of all users.

### Guest User

All RaptorSDR servers have a ``guest`` user that can be logged into without a password. By default, it has no permissions, and can't even connect to the server. If you'd like to change this, run the commands above with the username ``guest``.
