# WebChat-README 

## Description

This project is designed to .... and the main features are ...

## Getting Started

### Prerequisites

List all dependencies and their version needed by the project as :

* DataBase Engine (MySql, PostgreSQL, MSSQL,...)
* IDE used (PhpStorm, Visual Studio Code, IntelliJ,...)
* Package manager (Nuget, Composer, npm, ...)
* OS supported (W2k22, Debian12,...)
* Virtualization (Docker, .Net, .JDK, .JRE)

### Configuration

How to set up the database?
How do you set the sensitive data?

## Deployment

### On dev environment

How to get dependencies and build?

How to run the tests?

- Aller dans le répertoire "test" :

![image](https://github.com/CPNV-PRETPI/webchat/assets/106467708/96ede49a-5982-4252-8956-cde57785873e)
- Lancer l'emulator firebase suite avec la commande ```npm run emulators:start```

![image](https://github.com/CPNV-PRETPI/webchat/assets/106467708/8fd31600-7de2-469c-ba4c-b2f2bfa759e9)
![image](https://github.com/CPNV-PRETPI/webchat/assets/106467708/a640b187-244f-4f71-94c3-7c9b6244c7cb)
- Dans un autre Terminal aller dans le répertoire "test" puis faire la commande ```npm run test``` pour lancer tous les tests:

![image](https://github.com/CPNV-PRETPI/webchat/assets/106467708/c24ccbeb-721c-4509-9dcd-32079e2a418d)
![image](https://github.com/CPNV-PRETPI/webchat/assets/106467708/b0adc2d8-6728-4de8-ba59-79fa7a06b775)

![image](https://github.com/CPNV-PRETPI/webchat/assets/106467708/04b75dbf-e767-442c-bc76-9884d0fc4476)
- Pour lancer un seul test faire la commande ```npm run test:single "le nom du test"``` :

![image](https://github.com/CPNV-PRETPI/webchat/assets/106467708/ff661370-b2ca-43ba-af8a-c70dbbf0e4b0)
![image](https://github.com/CPNV-PRETPI/webchat/assets/106467708/a75766d7-888c-43a4-bb70-c55b378dea26)
- Pour lancer les test en debug mode ouvrir un "JavaScript Debug Terminal" puis refaire la même chose:

![image](https://github.com/CPNV-PRETPI/webchat/assets/106467708/2df43081-b8a8-496e-ba64-3c9c010acf5c)
- Une fois fini arreter l'emulator suite avec la commande ```npm run emulators:stop```

![image](https://github.com/CPNV-PRETPI/webchat/assets/106467708/b4516eaf-85a1-4358-8cb6-fd72ef5827ee)
![image](https://github.com/CPNV-PRETPI/webchat/assets/106467708/89f29b35-e5ed-4846-bcbd-95941e0d5a95)

.....

### On integration environment

How to deploy the application outside the dev environment.

## Directory structure

* Tip: try the tree bash command

```shell
├───Shopping                                        //classes and packages
│   ├───bin                                         //the binary to deploy on the end-user environment
        
├───.idea                                           //les informations sur le projet webstorm
├───docs                                            //la documentation
├───jest-test                                       //les classes de test
└───public                                          //le dossier qui est publier dans firebase
    └───View                                        //les différentes pages
        └───content
            └───logos                               //les fichiers des logos
```

## Collaborate

* Take time to read some readme and find the way you would like to help other developers collaborate with you.

* They need to know:
  * How to propose a new feature (issue, pull request)
  * [How to commit](https://www.conventionalcommits.org/en/v1.0.0/)
  * [How to use your workflow](https://nvie.com/posts/a-successful-git-branching-model/)

## License

* [Choose the license adapted to your project](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).

## Contact

Surico Joshua
[Issues Github](https://github.com/CPNV-TPI/webchat/issues)
ph73tll@eduvaud.ch
076 504 05 18
