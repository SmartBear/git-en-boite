import fs from 'fs'
import {
  DomainEventBus,
  InventoryOfRepos,
  LocalClones,
  NoSuchRepo,
  Repo,
  RepoAlreadyExists,
  RepoId,
} from 'git-en-boite-core'
import {
  assertThat,
  defined,
  equalTo,
  truthy,
  hasProperty,
  promiseThat,
  rejected,
  falsey,
} from 'hamjest'
import { wasCalled } from 'hamjest-sinon'
import { dirSync } from 'tmp'
import { stubInterface } from 'ts-sinon'

import { InventoryOfReposOnDisk } from './inventory_of_repos_on_disk'
import { RepoPath } from './repo_path'

describe(InventoryOfReposOnDisk.name, () => {
  let repoId: RepoId
  let basePath: string
  let repoPath: RepoPath
  let localClones: LocalClones
  let domainEvents: DomainEventBus
  let inventory: InventoryOfRepos

  beforeEach(() => {
    repoId = RepoId.generate()
    basePath = dirSync().name
    localClones = stubInterface<LocalClones>()
    domainEvents = stubInterface<DomainEventBus>()
    inventory = new InventoryOfReposOnDisk(basePath, localClones, domainEvents)
  })

  describe('creating new repos', () => {
    it('creates a new LocalClone when transaction succeeds', async () => {
      await inventory.create(repoId, async () => {})
      assertThat(localClones.createNew, wasCalled())
    })

    it('yields a Repo to the transaction', async () => {
      let foundRepo: Repo
      await inventory.create(repoId, async repo => {
        foundRepo = repo
      })
      assertThat(foundRepo, defined())
      assertThat(foundRepo, hasProperty('repoId', equalTo(repoId)))
    })

    context('when the transaction fails', () => {
      it('throws an error from the transaction', async () => {
        const error = new Error('oops')

        await promiseThat(
          inventory.create(repoId, async () => {
            throw error
          }),
          rejected(error),
        )
      })

      it('removes the local clone', async () => {
        try {
          await inventory.create(repoId, async () => {
            throw new Error('oops')
          })
        } catch {}
        assertThat(localClones.removeExisting, wasCalled())
      })
    })

    context('when the repo already exists', () => {
      beforeEach(() => {
        repoPath = RepoPath.for(basePath, repoId)
        fs.mkdirSync(repoPath.value, { recursive: true })
      })

      it(`fails with ${RepoAlreadyExists.name}`, async () => {
        await promiseThat(
          inventory.create(repoId, async () => {}),
          rejected(RepoAlreadyExists.forRepoId(repoId)),
        )
      })
    })
  })

  describe('finding existing repos', () => {
    context('when a folder exists for the repo', () => {
      beforeEach(() => {
        repoPath = RepoPath.for(basePath, repoId)
        fs.mkdirSync(repoPath.value, { recursive: true })
      })

      it('returns a Repo', async () => {
        const repo = await inventory.find(repoId)
        assertThat(repo, defined())
        assertThat(repo, hasProperty('repoId', equalTo(repoId)))
      })

      it('opens a LocalClone', async () => {
        await inventory.find(repoId)
        assertThat(localClones.openExisting, wasCalled())
      })
    })

    it(`fails with ${NoSuchRepo.name} when the repo does not exist`, async () => {
      const repoId = RepoId.generate()
      await promiseThat(inventory.find(repoId), rejected(NoSuchRepo.forRepoId(repoId)))
    })
  })

  describe('checking if a repo exists', () => {
    it('returns true if a folder exists for the repo', async () => {
      repoPath = RepoPath.for(basePath, repoId)
      fs.mkdirSync(repoPath.value, { recursive: true })
      assertThat(await inventory.exists(repoId), truthy())
    })

    it('returns false if no folder exists for the repo', async () => {
      repoPath = RepoPath.for(basePath, repoId)
      assertThat(await inventory.exists(repoId), falsey())
    })
  })
})
